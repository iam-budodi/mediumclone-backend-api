import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateArticleDto } from '@app/article/dto/createArticle.dto';
import { ArticleEntity } from '@app/article/article.entity';
import { DeleteResult, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';
import { UserEntity } from '@app/user/user.entity';
import { ArticleResponseInterface } from '@app/article/types/article-response.interface';
import { UpdateArticleDto } from '@app/article/dto/updateArticle.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
  ) {}

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
