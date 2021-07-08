import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateArticleDto } from '@app/article/dto/createArticle.dto';
import { ArticleEntity } from '@app/article/article.entity';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { UserEntity } from '@app/user/user.entity';
import { ArticleResponseInterface } from '@app/article/types/article-response.interface';
import { UpdateArticleDto } from '@app/article/dto/updateArticle.dto';
import { ArticlesResponseInterface } from '@app/article/types/articles-response.interface';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(
    userId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const { author, limit, favorited, offset, tag } = query;
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author');

    queryBuilder.orderBy('articles.createdAt', 'DESC');

    if (tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', { tag: `%${tag}` });
    }

    if (author) {
      const { id } = await this.userRepository.findOne({
        username: author,
      });
      queryBuilder.andWhere('articles.authorId = :id', { id });
    }

    if (favorited) {
      const author = await this.userRepository.findOne(
        { username: favorited },
        { relations: ['favorites'] },
      );

      const ids = author.favorites.map((element) => element.id);
      if (ids.length > 0) {
        queryBuilder.andWhere('articles.id IN (:...ids)', { ids });
      } else {
        queryBuilder.andWhere('1=0');
      }
    }

    const articlesCount = await queryBuilder.getCount();
    if (limit) queryBuilder.limit(limit);
    if (offset) queryBuilder.offset(offset);

    let favoritesIds: number[] = [];

    if (userId) {
      const loggedInUser = await this.userRepository.findOne(userId, {
        relations: ['favorites'],
      });
      favoritesIds = loggedInUser.favorites.map((favorite) => favorite.id);
    }
    const articles = await queryBuilder.getMany();
    const favoritedArticle = articles.map((article) => {
      const favorited = favoritesIds.includes(article.id);
      return { ...article, favorited };
    });

    return { articles: favoritedArticle, articlesCount };
  }

  async createArticle(
    currentUser: UserEntity,
    createArticleDto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const newArticle = new ArticleEntity();
    Object.assign(newArticle, createArticleDto);
    if (!newArticle.tagList) newArticle.tagList = [];

    newArticle.slug = this.getSlug(newArticle.title);
    newArticle.author = currentUser;
    return await this.articleRepository.save(newArticle);
  }

  async getArticleBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne(
      { slug },
      // { relations: ['author'] }, can be achieved by the option {eager: true} in article entity
    );
  }

  async getArticle(slug: string): Promise<ArticleEntity> {
    const article = await this.getArticleBySlug(slug);
    if (!article)
      throw new HttpException('Article does not exist.', HttpStatus.NOT_FOUND);
    return article;
  }

  async deleteArticle(userId: number, slug: string): Promise<DeleteResult> {
    const article = await this.getArticleBySlug(slug);
    if (!article)
      throw new HttpException('Article does not exist.', HttpStatus.NOT_FOUND);
    else if (userId !== article.author.id)
      throw new HttpException(
        "You can't delete this article",
        HttpStatus.FORBIDDEN,
      );
    return await this.articleRepository.delete({ slug });
  }

  async updateArticle(
    userId: number,
    slug: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleEntity> {
    const article = await this.getArticleBySlug(slug);
    if (!article)
      throw new HttpException('Article does not exist.', HttpStatus.NOT_FOUND);
    else if (userId !== article.author.id)
      throw new HttpException(
        "You can't modify this article",
        HttpStatus.FORBIDDEN,
      );
    else if (
      updateArticleDto.constructor === Object &&
      Object.entries(updateArticleDto).length === 0
    )
      throw new HttpException(
        'Please provide contents for modification',
        HttpStatus.BAD_REQUEST,
      );

    if (updateArticleDto.title)
      article.slug = this.getSlug(updateArticleDto.title);

    Object.assign(article, updateArticleDto);
    return await this.articleRepository.save(article);
  }

  async addArticleToFavorites(
    userId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.getArticleBySlug(slug);
    const user = await this.userRepository.findOne(userId, {
      relations: ['favorites'],
    });

    const isNotFavorited =
      user.favorites.findIndex(
        (articleInFavorites) => articleInFavorites.id === article.id,
      ) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favouritesCount++;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  async deleteArticleFromFavorites(
    userId: number,
    slug: string,
  ): Promise<ArticleEntity> {
    const article = await this.getArticleBySlug(slug);
    const user = await this.userRepository.findOne(userId, {
      relations: ['favorites'],
    });

    const articleIndex = user.favorites.findIndex(
      (articleInFavorites) => articleInFavorites.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favouritesCount--;
      await this.userRepository.save(user);
      await this.articleRepository.save(article);
    }

    return article;
  }

  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  private getSlug(title: string): string {
    return (
      slugify(title, { lower: true }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }
}
